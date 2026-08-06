import { Router } from "express";
import { CATEGORY_LABELS_UZ, PRIORITY_LABELS_UZ, STATUS_LABELS_UZ } from "@app/shared-types";
import { requireAuth } from "../../core/middlewares/requireAuth";

export const categoriesRouter = Router();

// MVPda kategoriyalar fixed enum (talab spetsifikatsiyasidagidek); kelajakda
// bu endpoint DB-backed dynamic kategoriyalarga osongina almashtiriladi.
categoriesRouter.get("/", requireAuth, (_req, res) => {
  res.json(
    Object.entries(CATEGORY_LABELS_UZ).map(([value, label]) => ({ value, label }))
  );
});

categoriesRouter.get("/priorities", requireAuth, (_req, res) => {
  res.json(Object.entries(PRIORITY_LABELS_UZ).map(([value, label]) => ({ value, label })));
});

categoriesRouter.get("/statuses", requireAuth, (_req, res) => {
  res.json(Object.entries(STATUS_LABELS_UZ).map(([value, label]) => ({ value, label })));
});
