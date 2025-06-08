// import { headers } from "next/headers";

const getUserId = async (request: Request) => {
  console.log("request", request.headers.get("x-forwarded-for"));
  //   const headersList = await headers();
  //   const ip = headersList.get("x-forwarded-for") || "unknown";
  //   const userAgent = headersList.get("user-agent") || "unknown";
  //   return `${ip}-${userAgent}`;

  return "test";
};

export { getUserId };
