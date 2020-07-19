import {BAD_REQUEST} from "http-status-codes";
import {ErrorBody} from "./index";
import * as chalk from "chalk";

export namespace errors {
    export namespace internal {
        export class BadDeveloperError extends Error {
            constructor(m: string) {
                super(chalk.red(`BAD_DEVELOPER_EXCEPTION:: seems like you made a mistake! : ${m}`));
                Object.setPrototypeOf(this, BadDeveloperError.prototype);
            }
        }

        export class NotImplementedError extends Error {
            constructor(m: string) {
                super(m);
                Object.setPrototypeOf(this, NotImplementedError.prototype);
            }
        }
    }

    export namespace request {
        export class ConflictError extends Error {
            constructor(m: string) {
                super(m);
                Object.setPrototypeOf(this, ConflictError.prototype);
            }
        }

        export class BadRequestError extends Error {
            constructor(m: string) {
                super(m);
                Object.setPrototypeOf(this, BadRequestError.prototype);
            }

            toData(): ErrorBody {
                return {
                    type: "BAD_REQUEST",
                    detail: this.message,
                    status: BAD_REQUEST,
                    title: this.message,
                }
            }
        }

        export class InvalidFormatError extends BadRequestError {
            constructor(message: string, e?: {
                fields: { field: string, type?: string, required?: boolean, message?: string }[],
            }) {
                super(message);
                Object.setPrototypeOf(this, InvalidFormatError.prototype);
            }
        }

        export class InvalidPhoneNumberError extends InvalidFormatError {
            constructor(m: string) {
                super(m);
                Object.setPrototypeOf(this, InvalidPhoneNumberError.prototype);
            }
        }

        export class NoPermissionError extends Error {
            constructor(m: string) {
                super(`OPERATION PERMISSION DENIED:: ${m}`);
                Object.setPrototypeOf(this, NoPermissionError.prototype);
            }
        }

        export class NotFoundError extends Error {
            constructor(m: string) {
                super(m);
                Object.setPrototypeOf(this, NotFoundError.prototype);
            }
        }
    }
}
