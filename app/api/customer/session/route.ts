import { NextResponse } from "next/server";
import { z } from "zod";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";
import {
  customerUserIdFromIdentity,
  setCustomerSessionCookie,
} from "@/lib/server/customer-session";
import { authErrorResponse, requireUser } from "@/lib/server/auth";

const customerSessionSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().optional().or(z.literal("")),
  mobile: z.string().trim().min(6).optional().or(z.literal("")),
  preferredLanguage: z.string().optional(),
});

function identityFor(input: z.infer<typeof customerSessionSchema>) {
  return input.mobile || input.email || input.name;
}

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    const repository = new CustomerProfileRepository();
    const customer = await repository.getCustomer(user.userId);
    const familyProfile = await repository.getFamilyProfile(user.userId);

    return NextResponse.json({
      authenticated: true,
      userId: user.userId,
      customer,
      familyProfile,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    return NextResponse.json(
      { error: { code: "CUSTOMER_SESSION_FAILED", message: "Unable to read customer session." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = customerSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "CUSTOMER_ACCOUNT_INVALID",
            message: "Please enter your name and either mobile number or email.",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const userId = customerUserIdFromIdentity(identityFor(input));
    const repository = new CustomerProfileRepository();
    const customer = await repository.upsertCustomer({
      userId,
      name: input.name,
      email: input.email || undefined,
      mobile: input.mobile || undefined,
      preferredLanguage: input.preferredLanguage,
    });

    const response = NextResponse.json({
      authenticated: true,
      userId,
      customer,
      message: "Customer account saved. You can continue.",
    });
    setCustomerSessionCookie(response, userId);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "CUSTOMER_SESSION_CREATE_FAILED",
          message: error instanceof Error ? error.message : "Unable to create customer session.",
        },
      },
      { status: 500 }
    );
  }
}
