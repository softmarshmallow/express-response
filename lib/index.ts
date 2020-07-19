import * as express from 'express'
import {
    OK,
    NO_CONTENT,
    NOT_FOUND,
    NOT_IMPLEMENTED,
    INTERNAL_SERVER_ERROR,
    BAD_REQUEST,
    CONFLICT,
    UNAUTHORIZED
} from "http-status-codes";
import {errors} from "./errors";
import {AssertionError} from "assert";

export interface ErrorBody {
    type: string
    title: string
    detail: string
    status: number
    data?: {}
}

interface RequestInformation {
    url: string
}


interface BaseResponse<T> {
    model: string
    data: T
    action: string
    error: ErrorBody
    request?: RequestInformation
    status: number
    hasMore?: boolean
}

function getRequestUrl(req: express.Request) {
    return req.originalUrl
}

function getModelNameByRoute(req: express.Request) {
    return getRequestUrl(req)
}

abstract class BaseServerResponse<T> {
    private _res: express.Response;
    _body: BaseResponse<T>;

    protected constructor(body: BaseResponse<T>, res: express.Response) {
        this._res = res;
        this._body = body;
    }

    send() {
        try {
            if (this._body.error) {
                console.error(this._body.error);
            }
            this._res.status(this._body.status).json(this._body)
        } catch (e) {
            console.error(e);
            this._res.status(this._body.status ?? INTERNAL_SERVER_ERROR).send(e);
        }
    }

    body() {
        return this._body;
    }
}

class SingleDataResponse<T> extends BaseServerResponse<T> {
    constructor(body: BaseResponse<T>, res) {
        super(body, res);
    }
}

class ManyDataResponse<T> extends BaseServerResponse<Array<T>> {
    constructor(body: BaseResponse<Array<T>>, res) {
        super(body, res);
    }
}

class NoContentResponse extends BaseServerResponse<any> {
    constructor(body: BaseResponse<any>, res) {
        super(body, res);
    }
}

class BaseServerErrorResponse<T> extends BaseServerResponse<T> {
    constructor(body: BaseResponse<T>, res) {
        super(body, res);
    }
}

class NotFoundErrorResponse extends BaseServerErrorResponse<any> {
    constructor(body: BaseResponse<any>, res) {
        super(body, res);
    }
}

class BadRequestErrorResponse extends BaseServerErrorResponse<any> {
    constructor(body: BaseResponse<any>, res) {
        super(body, res);
    }
}

class ConflictDataServerResponse<T> extends BaseServerErrorResponse<T> {
    constructor(body: BaseResponse<T>, res) {
        super(body, res);
    }
}

class UnAuthorizedServerResponse<T> extends BaseServerErrorResponse<T> {
    constructor(body: BaseResponse<T>, res) {
        super(body, res);
    }
}

class ExpressResponseBuilder {
    static ok<T>(data: T, req: express.Request, res: express.Response) {
        return new BaseServerErrorResponse({
            status: OK,
            data: data ?? "OK",
            action: null,
            model: getModelNameByRoute(req),
            error: null
        }, res);
    }

    static notfound<T>(req: express.Request, res: express.Response) {
        return new NotFoundErrorResponse({
            status: NOT_FOUND,
            data: null,
            action: null,
            model: getModelNameByRoute(req),
            error: {
                title: "not found",
                detail: "record not found",
                status: NOT_FOUND,
                type: "NOT_FOUND"
            }
        }, res);
    }

    static empty<T>(req: express.Request, res: express.Response) {
        return new NoContentResponse({
            status: NO_CONTENT,
            data: null,
            action: null,
            model: getModelNameByRoute(req),
            error: {
                title: "not found",
                detail: "record not found",
                status: NOT_FOUND,
                type: "NOT_FOUND"
            }
        }, res);
    }

    static conflict<T>(req, res) {
        return new ConflictDataServerResponse({
            action: null,
            data: null,
            error: {
                title: "conflict data",
                detail: "data is conflicted",
                status: CONFLICT,
                type: "CONFLICT"
            },
            model: getModelNameByRoute(req),
            status: CONFLICT

        }, res);
    }

    static unauthorized(reason, req, res) {
        return new UnAuthorizedServerResponse({
            action: null,
            data: null,
            error: {
                title: "authentication failed",
                detail: reason,
                status: UNAUTHORIZED,
                type: "UNAUTHORIZED"
            },
            model: getModelNameByRoute(req),
            status: UNAUTHORIZED
        }, res);
    }

    static badrequest<T>(e: errors.request.BadRequestError, req, res) {
        return new BadRequestErrorResponse({
            action: null,
            data: null,
            error: e.toData(),
            model: getModelNameByRoute(req),
            status: BAD_REQUEST
        }, res);
    }

    static error<T>(e: Error, req: express.Request, res: express.Response) {
        console.error(e);

        // region simple error handler
        let status = INTERNAL_SERVER_ERROR;
        let title = "INTERNAL_SERVER_ERROR";
        if (e instanceof errors.request.BadRequestError) {
            status = BAD_REQUEST
            title = "BAD REQUEST"
        } else if (e instanceof errors.request.NoPermissionError) {
            status = UNAUTHORIZED;
            title = "no permission"
        } else if (e instanceof errors.request.NotFoundError) {
            status = NOT_FOUND
            title = "NOT FOUND"
        } else if (e instanceof AssertionError) {
            status = BAD_REQUEST
            title = "BAD REQUEST"
        } else if (e instanceof errors.internal.NotImplementedError) {
            status = NOT_IMPLEMENTED
            title = "NOT IMPLEMENTED"
        } else if (e.message?.includes("A unique constraint would be violated")) {
            status = CONFLICT
            title = "conflict data provided";
        }
        // endregion


        return new BaseServerErrorResponse<T>({
            status: status,
            data: null,
            model: getModelNameByRoute(req),
            error: {
                title: title,
                detail: e.message,
                status: status,
                type: e.name
            },
            action: null
        }, res);
    }

    static single<T>(data: T, req: express.Request, res: express.Response) {
        if (!data) {
            return ExpressResponseBuilder.notfound<T>(req, res);
        } else {
            return new SingleDataResponse(
                {
                    data: data,
                    model: getModelNameByRoute(req),
                    status: OK,
                    error: null,
                    action: null
                }, res
            );
        }

    }

    static many<T>(data: Array<T>, req: express.Request, res: express.Response) {
        if (!data) {
            return ExpressResponseBuilder.notfound<T>(req, res);
        }
        return new ManyDataResponse<T>({
            data: data,
            model: getModelNameByRoute(req),
            status: OK,
            error: null,
            action: null
        }, res);
    }

    static paginateMany<T>(data: Array<T>, req: express.Request, res: express.Response, hasNext: boolean) {
        return new ManyDataResponse<T>({
            data: data,
            model: getModelNameByRoute(req),
            status: OK,
            hasMore: hasNext,
            error: null,
            action: null

        }, res);
    }

    static raw<T>(data: T, req, res) {

    }
}

export {
    ExpressResponseBuilder as response,
    errors as errors
}
