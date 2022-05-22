import { HttpContext } from "../shared/http-context";
import { RoutingContext } from "../shared/routing-context";

export interface IFilter {
    // right order: global > controller > action
    beforeExecute?(httpContext: HttpContext, routingContext: RoutingContext): Promise<void> | void;

    // inverse order: action > controller > global
    afterExecute?(httpContext: HttpContext, routingContext: RoutingContext): Promise<void> | void;
    onError?(httpContext: HttpContext, routingContext: RoutingContext, error: Error): Promise<void> | void;
}
