
import { dbAdmin } from "./lib/instantdb/admin";

console.log("Auth:", Object.keys(dbAdmin.auth || {}));
console.log("Storage:", Object.keys(dbAdmin.storage || {}));

