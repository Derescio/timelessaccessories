import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Add console logs to track request handling
//onsole.log("Initializing UploadThing route handler");

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
}); 