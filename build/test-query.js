import { getAssetStatus } from "./src/tools/assets.tool.js";
import { connectToMongo } from "./src/services/mongo.service.js";
async function test() {
    try {
        await connectToMongo();
        console.log(await getAssetStatus({ assetId: "JPZ84HWB" }));
    }
    catch (e) {
        console.error(e);
    }
    finally {
        process.exit(0);
    }
}
test();
//# sourceMappingURL=test-query.js.map