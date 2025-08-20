export interface MessageType {
  code: number;
  message: string;
}

const responses = {
  api: {
    login: {
      success: {
        code: 200,
        message: "User Logined successfully",
      },
      wrongPassword: {
        code: 401,
        message: "Wrong password or Email",
      },
      userNotFound: {
        code: 404,
        message: "User not found",
      },
    },
    register: {
      success: {
        code: 201,
        message: "User registered successfully",
      },
      userExists: {
        code: 409,
        message: "User already exists",
      },
    },
    logout: {
      success: {
        code: 200,
        message: "Logged out successfully",
      },
      noSession: {
        code: 400,
        message: "No session found",
      },
    },
    refresh: {
      success: {
        code: 200,
        message: "Access token refreshed successfully",
      },
      noToken: {
        code: 401,
        message: "No refresh token provided",
      },
      invalidToken: {
        code: 403,
        message: "Invalid refresh token",
      },
      tokenExpired: {
        code: 403,
        message: "Refresh token expired",
      },
    },
    resetPassword: {
      userNotFound: {
        code: 400,
        message: "User Not Found",
      },
      requestSuccessful: {
        code: 200,
        message: "OTP sent To Email successfully",
      },
      invalidOTP: {
        code: 400,
        message: "Invalid OTP",
      },
      validOTP: {
        code: 201,
        message: "",
      },
      resetPasswordSuccessfully: {
        code: 200,
        message: "Password Reset Successfully",
      },
      passwordsDoNotMatch: {
        code: 400,
        message: "Passwords do not match.",
      },
    },
    user: {
      notFound: {
        code: 404,
        message: "User not found",
      },
      created: {
        code: 201,
        message: "User created successfully",
      },
      updated: {
        code: 200,
        message: "User updated successfully",
      },
      deleted: {
        code: 200,
        message: "User deleted successfully",
      },
    },
  },
  Error: {
    internalServerError: {
      code: 500,
      message: "Internal server error",
    },
    invalidInput: {
      code: 400,
      message: "Validation Error",
    },
  },
} as const;

export default responses;
