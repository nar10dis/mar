import * as runtime from "@prisma/client/runtime/client";
const config = {
    "previewFeatures": [],
    "clientVersion": "7.10.1",
    "engineVersion": "d1b3f377ca835d73fd50954a5e22128b9ebdd6b8",
    "activeProvider": "postgresql",
    "inlineSchema": "generator client {\n  provider = \"prisma-client\"\n  output   = \"../src/generated/prisma\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n}\n\nmodel Message {\n  id        Int      @id @default(autoincrement())\n  author    String\n  content   String\n  createdAt DateTime @default(now())\n}\n",
    "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
    },
    "parameterizationSchema": {
        "strings": [],
        "graph": ""
    }
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"Message\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"author\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"content\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null,\"schema\":null}},\"enums\":{},\"types\":{}}");
config.parameterizationSchema = {
    strings: JSON.parse("[\"where\",\"Message.findUnique\",\"Message.findUniqueOrThrow\",\"orderBy\",\"cursor\",\"Message.findFirst\",\"Message.findFirstOrThrow\",\"Message.findMany\",\"data\",\"Message.createOne\",\"Message.createMany\",\"Message.createManyAndReturn\",\"Message.updateOne\",\"Message.updateMany\",\"Message.updateManyAndReturn\",\"create\",\"update\",\"Message.upsertOne\",\"Message.deleteOne\",\"Message.deleteMany\",\"having\",\"_count\",\"_avg\",\"_sum\",\"_min\",\"_max\",\"Message.groupBy\",\"Message.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"author\",\"content\",\"createdAt\",\"equals\",\"in\",\"notIn\",\"lt\",\"lte\",\"gt\",\"gte\",\"not\",\"contains\",\"startsWith\",\"endsWith\",\"set\",\"increment\",\"decrement\",\"multiply\",\"divide\"]"),
    graph: "MAsQBxwAACUAMB0AAAQAEB4AACUAMB8CAAAAASABACcAISEBACcAISJAACgAIQEAAAABACABAAAAAQAgBxwAACUAMB0AAAQAEB4AACUAMB8CACYAISABACcAISEBACcAISJAACgAIQADAAAABAAgAwAABQAwBAAAAQAgAwAAAAQAIAMAAAUAMAQAAAEAIAMAAAAEACADAAAFADAEAAABACAEHwIAAAABIAEAAAABIQEAAAABIkAAAAABAQgAAAkAIAQfAgAAAAEgAQAAAAEhAQAAAAEiQAAAAAEBCAAACwAwAQgAAAsAMAQfAgAwACEgAQAuACEhAQAuACEiQAAvACECAAAAAQAgCAAADgAgBB8CADAAISABAC4AISEBAC4AISJAAC8AIQIAAAAEACAIAAAQACACAAAABAAgCAAAEAAgAwAAAAEAIA8AAAkAIBAAAA4AIAEAAAABACABAAAABAAgBRUAACkAIBYAACoAIBcAAC0AIBgAACwAIBkAACsAIAccAAAaADAdAAAXABAeAAAaADAfAgAbACEgAQAcACEhAQAcACEiQAAdACEDAAAABAAgAwAAFgAwFAAAFwAgAwAAAAQAIAMAAAUAMAQAAAEAIAccAAAaADAdAAAXABAeAAAaADAfAgAbACEgAQAcACEhAQAcACEiQAAdACENFQAAHwAgFgAAJAAgFwAAHwAgGAAAHwAgGQAAHwAgIwIAAAABJAIAAAAEJQIAAAAEJgIAAAABJwIAAAABKAIAAAABKQIAAAABKgIAIwAhDhUAAB8AIBgAACIAIBkAACIAICMBAAAAASQBAAAABCUBAAAABCYBAAAAAScBAAAAASgBAAAAASkBAAAAASoBACEAISsBAAAAASwBAAAAAS0BAAAAAQsVAAAfACAYAAAgACAZAAAgACAjQAAAAAEkQAAAAAQlQAAAAAQmQAAAAAEnQAAAAAEoQAAAAAEpQAAAAAEqQAAeACELFQAAHwAgGAAAIAAgGQAAIAAgI0AAAAABJEAAAAAEJUAAAAAEJkAAAAABJ0AAAAABKEAAAAABKUAAAAABKkAAHgAhCCMCAAAAASQCAAAABCUCAAAABCYCAAAAAScCAAAAASgCAAAAASkCAAAAASoCAB8AIQgjQAAAAAEkQAAAAAQlQAAAAAQmQAAAAAEnQAAAAAEoQAAAAAEpQAAAAAEqQAAgACEOFQAAHwAgGAAAIgAgGQAAIgAgIwEAAAABJAEAAAAEJQEAAAAEJgEAAAABJwEAAAABKAEAAAABKQEAAAABKgEAIQAhKwEAAAABLAEAAAABLQEAAAABCyMBAAAAASQBAAAABCUBAAAABCYBAAAAAScBAAAAASgBAAAAASkBAAAAASoBACIAISsBAAAAASwBAAAAAS0BAAAAAQ0VAAAfACAWAAAkACAXAAAfACAYAAAfACAZAAAfACAjAgAAAAEkAgAAAAQlAgAAAAQmAgAAAAEnAgAAAAEoAgAAAAEpAgAAAAEqAgAjACEIIwgAAAABJAgAAAAEJQgAAAAEJggAAAABJwgAAAABKAgAAAABKQgAAAABKggAJAAhBxwAACUAMB0AAAQAEB4AACUAMB8CACYAISABACcAISEBACcAISJAACgAIQgjAgAAAAEkAgAAAAQlAgAAAAQmAgAAAAEnAgAAAAEoAgAAAAEpAgAAAAEqAgAfACELIwEAAAABJAEAAAAEJQEAAAAEJgEAAAABJwEAAAABKAEAAAABKQEAAAABKgEAIgAhKwEAAAABLAEAAAABLQEAAAABCCNAAAAAASRAAAAABCVAAAAABCZAAAAAASdAAAAAAShAAAAAASlAAAAAASpAACAAIQAAAAAAAS4BAAAAAQEuQAAAAAEFLgIAAAABLwIAAAABMAIAAAABMQIAAAABMgIAAAABAAAAAAUVAAYWAAcXAAgYAAkZAAoAAAAAAAUVAAYWAAcXAAgYAAkZAAoBAgECAwEFBgEGBwEHCAEJCgEKDAILDQMMDwENEQIOEgQREwESFAETFQIaGAUbGQs"
};
async function decodeBase64AsWasm(wasmBase64) {
    const { Buffer } = await import('node:buffer');
    const wasmArray = Buffer.from(wasmBase64, 'base64');
    return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
    getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
    getQueryCompilerWasmModule: async () => {
        const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
        return await decodeBase64AsWasm(wasm);
    },
    importName: "./query_compiler_fast_bg.js"
};
export function getPrismaClientClass() {
    return runtime.getPrismaClient(config);
}
//# sourceMappingURL=class.js.map