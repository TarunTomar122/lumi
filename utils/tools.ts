import * as Battery from "expo-battery";

const clientToolsSchema = [
  {
    type: "function",
    name: "getBatteryLevel",
    description: "Gets the device battery level as decimal point percentage.",
  },
];

const clientTools: Record<string, any> = {
  getBatteryLevel: async () => {
    const batteryLevel = await Battery.getBatteryLevelAsync();
    console.log("Battery level:", batteryLevel);
    if (batteryLevel === -1) {
      return {
        success: false,
        error: "Device does not support retrieving the battery level.",
      };
    }
    return { success: true, batteryLevel };
  }
};

export { clientTools, clientToolsSchema };
