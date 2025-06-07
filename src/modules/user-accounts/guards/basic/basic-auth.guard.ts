import { Request } from "express";
import { Reflector } from "@nestjs/core";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { DomainException } from "../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../core/exceptions/domain-exception-codes";
import { AuthConfig } from "../../auth/config/auth.config";

@Injectable()
export class BasicAuthGuard implements CanActivate {
  private readonly validUsername: string;
  private readonly validPassword: string;

  constructor(
    private reflector: Reflector,
    private authConfig: AuthConfig,
  ) {
    this.validUsername = this.authConfig.basicAuthLogin;
    this.validPassword = this.authConfig.basicAuthPassword;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    //https://docs.nestjs.com/security/authentication#enable-authentication-globally
    // reflection
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: "unauthorised",
      });
    }

    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8",
    );
    const [username, password] = credentials.split(":");

    if (username === this.validUsername && password === this.validPassword) {
      return true;
    } else {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: "unauthorised",
      });
    }
  }
}
