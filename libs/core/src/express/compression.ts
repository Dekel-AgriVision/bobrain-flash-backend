import compression from "compression";
import { Application } from "express";


export function enableCompression(app: Application): void {
  app.use(compression());
}
