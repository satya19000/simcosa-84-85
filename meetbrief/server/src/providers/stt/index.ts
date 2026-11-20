import { config } from "../../config.js";
import { GoogleSttProvider } from "./google.js";
import { MockSttProvider } from "./mock.js";
import { SarvamSttProvider } from "./sarvam.js";
import type { SttProvider } from "./types.js";

export * from "./types.js";

let provider: SttProvider | undefined;

export function getSttProvider(): SttProvider {
  if (!provider) {
    switch (config.STT_PROVIDER) {
      case "sarvam":
        provider = new SarvamSttProvider();
        break;
      case "google":
        provider = new GoogleSttProvider();
        break;
      default:
        provider = new MockSttProvider();
    }
  }
  return provider;
}
