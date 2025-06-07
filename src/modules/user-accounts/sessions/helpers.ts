import { UAParser } from "ua-parser-js";

export const getDeviceTitle = (userAgent: string | undefined): string => {
  if (!userAgent) {
    return "unknown device";
  }

  const parsedUA = new UAParser(userAgent);
  const browser = parsedUA.getBrowser();
  const os = parsedUA.getOS();
  return `Browser: ${browser.name} ${browser.version}; OS: ${os.name} ${os.version}`;
};
