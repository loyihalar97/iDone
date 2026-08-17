import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../core/errors/errorHandler";
import { authService, toCurrentUserDto } from "./auth.service";
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
    res.json({ token, user: toCurrentUserDto(user) });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await authService.me(req.auth!.userId);
    res.json(toCurrentUserDto(user));
  })
);
