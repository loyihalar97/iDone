import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../core/errors/errorHandler";
import { authService } from "./auth.service";
import { requireAuth } from "../../core/middlewares/requireAuth";

export const authRouter = Router();

const loginSchema = z.object({
  initData: z.string().min(1),
});

authRouter.post(
  "/telegram",
  asyncHandler(async (req, res) => {
    const { initData } = loginSchema.parse(req.body);
    const { token, user } = await authService.loginWithTelegram(initData);
    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        branchId: user.branchId,
        isActive: user.isActive,
      },
    });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await authService.me(req.auth!.userId);
    res.json({
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      branchId: user.branchId,
      branchName: user.branch?.name ?? null,
      isActive: user.isActive,
    });
  })
);
