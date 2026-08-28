/* ==================================================================
   Turns a bought or downloaded car model into one the visualizer can
   drop straight in.

     pnpm dlx --package=@gltf-transform/core --package=@gltf-transform/extensions \
              --package=@gltf-transform/functions --package=draco3dgltf --package=sharp \
              node scripts/prepare-car.mjs <input.gltf|glb> <output.glb> <length-m>

   The packages are deliberately not project dependencies — this runs
   once per new car, never at build or run time.

   Models arrive in whatever units and wherever in space their maker
   happened to leave them — the Huracán sat 365 units from the origin
   and was four times life size. Rather than guess a scale at runtime,
   every car is normalised once, here:

     · centred on the origin left to right and front to back
     · dropped so its lowest point is the floor
     · resized so its longest side is the real car's length in metres
     · thinned only if a triangle budget is asked for
     · textures shrunk and re-encoded as WebP
     · geometry Draco-compressed

   The Huracán came out of this at 683 KB, from 7.3 MB.
   ================================================================== */

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  draco,
  getBounds,
  prune,
  resample,
  simplify,
  textureCompress,
  weld,
} from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import draco3d from "draco3dgltf";
import sharp from "sharp";

const [input, output, lengthArg, budgetArg] = process.argv.slice(2);
if (!input || !output) {
  console.error(
    "usage: bun scripts/prepare-car.mjs <input> <output.glb> [length-in-metres] [triangle-budget]",
  );
  process.exit(1);
}
const targetLength = Number(lengthArg ?? 4.5);

/* Showroom models are built for still renders and run into millions of
   triangles, most of them in an interior nobody will open. A car reads
   perfectly at this budget and a phone can still turn it. */
const triangleBudget = Number(budgetArg ?? 200_000);

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "draco3d.encoder": await draco3d.createEncoderModule(),
});

const doc = await io.read(input);
await doc.transform(dedup(), prune(), resample(), weld());

const scene = doc.getRoot().listScenes()[0];

/* Measure, then wrap everything in one node that carries the fix.
   Scaling first and shifting second would need the shift scaled too,
   so the translation is worked out in the final, scaled units. */
const before = getBounds(scene);
const size = before.max.map((v, i) => v - before.min[i]);
const longest = Math.max(size[0], size[2]);
const scale = longest > 0 ? targetLength / longest : 1;

const holder = doc
  .createNode("normalised")
  .setScale([scale, scale, scale])
  .setTranslation([
    -((before.min[0] + before.max[0]) / 2) * scale,
    -before.min[1] * scale,
    -((before.min[2] + before.max[2]) / 2) * scale,
  ]);

for (const node of scene.listChildren()) {
  scene.removeChild(node);
  holder.addChild(node);
}
scene.addChild(holder);

const triangles = doc
  .getRoot()
  .listMeshes()
  .flatMap((mesh) => mesh.listPrimitives())
  .reduce((total, primitive) => total + (primitive.getIndices()?.getCount() ?? 0) / 3, 0);

if (triangles > triangleBudget) {
  const ratio = triangleBudget / triangles;
  console.log(`thinning ${Math.round(triangles).toLocaleString()} triangles to ~${triangleBudget.toLocaleString()}`);
  await doc.transform(
    /* A tight error budget matters more than the ratio. Let the
       collapser wander and it eats the curve of a door panel, which
       reads as accident damage rather than a lower poly count. */
    simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.0002, lockBorder: true }),
  );
}

await doc.transform(
  /* 1K is plenty. The bodywork is repainted by the visualizer and
     carries no texture at all; what is left is interior trim, which
     the scene darkens anyway. */
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024] }),
  /* Higher than the defaults. A car is one big smooth surface, and
     coarse normals show up on a bonnet as faceting the moment a
     studio light slides across it. */
  draco({ quantizePosition: 16, quantizeNormal: 14 }),
);
await io.write(output, doc);

const after = getBounds(doc.getRoot().listScenes()[0]);
const fixed = after.max.map((v, i) => +(v - after.min[i]).toFixed(2));
console.log(
  `${output}\n  size  ${fixed.join(" x ")} m\n  floor y=${after.min[1].toFixed(3)}` +
    `  centre x=${((after.min[0] + after.max[0]) / 2).toFixed(3)} z=${((after.min[2] + after.max[2]) / 2).toFixed(3)}`,
);
