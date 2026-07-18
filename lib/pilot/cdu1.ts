import { ASSET_LIST, type AssetId } from "@/lib/demo/scenarios";

/** CDU-1 pilot unit — 15 assets for Rheinland Dominik pilot */
export const CDU1_UNIT_LABEL = "CDU-1 · Crude Distillation Unit";

export const CDU1_ASSET_LIST = ASSET_LIST.filter((a) => a.unit.startsWith("CDU-1"));

export const CDU1_ASSET_IDS = CDU1_ASSET_LIST.map((a) => a.id) as AssetId[];

export const CDU1_ASSET_COUNT = CDU1_ASSET_LIST.length;
