import { req } from "../helpers";
import { SETTINGS } from "../../settings";

export const deleteRateLimitsData = async () => {
  await req.delete(`${SETTINGS.PATH.TESTING}/rate-limits`).expect(204);
};
