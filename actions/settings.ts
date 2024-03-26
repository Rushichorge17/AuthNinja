import * as z from "zod";
import bcrypt from "bcryptjs";

import { update } from "@/auth";
import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export const settings = async (
  values: z.infer<typeof SettingsSchema>
) => {
  const user = await currentUser();

  if (!user) {
    return { error: "Unauthorized" }
  }

  // Type guard to ensure user.id is defined
  if (user.id === undefined) {
    return { error: "User ID is undefined" };
  }

  const dbUser = await getUserById(user.id);

  if (!dbUser) {
    return { error: "Unauthorized" }
  }

  if (user.isOAuth) {
    // Ensure that these values are defined before assigning them
    if (values.email) values.email = undefined;
    if (values.password) values.password = undefined;
    if (values.newPassword) values.newPassword = undefined;
    if (values.isTwoFactorEnabled) values.isTwoFactorEnabled = undefined;
  }

  // Check if email is defined before accessing it
  if (values.email && values.email !== user.email) {
    const existingUser = await getUserByEmail(values.email);

    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email already in use!" }
    }

    const verificationToken = await generateVerificationToken(
      values.email
    );
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    return { success: "Verification email sent!" };
  }

  // Check if passwords are defined before accessing them
  if (values.password && values.newPassword && dbUser.password) {
    const passwordsMatch = await bcrypt.compare(
      values.password,
      dbUser.password,
    );

    if (!passwordsMatch) {
      return { error: "Incorrect password!" };
    }

    const hashedPassword = await bcrypt.hash(
      values.newPassword,
      10,
    );
    values.password = hashedPassword;
    values.newPassword = undefined;
  }

  // Ensure that only defined properties are passed to update function
  const updatedUser = await db.user.update({
    where: { id: dbUser.id },
    data: {
      // Omit undefined properties from values
      ...(values.email && { email: values.email }),
      ...(values.password && { password: values.password }),
      ...(values.newPassword && { newPassword: values.newPassword }),
      ...(values.isTwoFactorEnabled && { isTwoFactorEnabled: values.isTwoFactorEnabled }),
      // Add other properties here
    }
  });

  update({
    user: {
      name: updatedUser.name || "", // Default to an empty string if name is undefined
      email: updatedUser.email || "", // Default to an empty string if email is undefined
      isTwoFactorEnabled: updatedUser.isTwoFactorEnabled || false, // Default to false if isTwoFactorEnabled is undefined
      role: updatedUser.role,
    }
  });
  

  return { success: "Settings Updated!" }
}
