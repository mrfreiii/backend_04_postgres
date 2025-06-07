import {
  INestApplication,
  ValidationPipe,
  ValidationError,
} from "@nestjs/common";

import {
  DomainException,
  Extension,
} from "../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../core/exceptions/domain-exception-codes";

export const throwFormattedErrors = (
  errors: ValidationError[],
  errorMessage?: any,
): Extension[] => {
  const errorsForResponse = errorMessage || [];

  for (const error of errors) {
    if (!error.constraints && error.children?.length) {
      throwFormattedErrors(error.children, errorsForResponse);
    } else if (error.constraints) {
      const constrainKeys = Object.keys(error.constraints);

      for (const key of constrainKeys) {
        errorsForResponse.push({
          message: error.constraints[key]
            ? `${error.constraints[key]}; Received value: ${error?.value}`
            : "",
          field: error.property,
        });
      }
    }
  }

  throw new DomainException({
    message: "Validation failed",
    code: DomainExceptionCode.ValidationError,
    extensions: errorsForResponse,
  });
};

export function pipesSetup(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        throwFormattedErrors(errors);
      },
    }),
  );
}
