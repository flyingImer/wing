import { Collector } from "./collector";
import os from "os";

export interface OSData {
  arch: string;
  platform: string;
  release: string;
}

export class OSCollector extends Collector {
  async collect(): Promise<OSData> {
    return {
      arch: os.arch(),
      platform: os.platform(),
      release: os.release(),
    }
  }
}