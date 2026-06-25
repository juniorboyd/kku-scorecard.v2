import { Request, Response } from "express";
import { getNetworkTopology } from "../services/librenmsService.ts";

export async function getTopologyHandler(req: Request, res: Response) {
  try {
    const topology = await getNetworkTopology();
    res.json({ success: true, data: topology });
  } catch (error: any) {
    console.error("[NetworkController] Failed to fetch topology:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
