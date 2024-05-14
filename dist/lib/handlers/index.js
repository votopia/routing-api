import { QuoteHandlerInjector } from "./quote/injector";
import { QuoteHandler } from "./quote/quote";
import { default as bunyan } from "bunyan";
const log = bunyan.createLogger({
    name: "Root",
    serializers: bunyan.stdSerializers,
    level: bunyan.INFO,
});
let quoteHandler;
try {
    const quoteInjectorPromise = new QuoteHandlerInjector("quoteInjector").build();
    quoteHandler = new QuoteHandler("quote", quoteInjectorPromise);
}
catch (error) {
    log.fatal({ error }, "Fatal error");
    throw error;
}
module.exports = {
    quoteHandler: quoteHandler.handler,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvaGFuZGxlcnMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDeEQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUUsT0FBTyxJQUFJLE1BQU0sRUFBcUIsTUFBTSxRQUFRLENBQUM7QUFFOUQsTUFBTSxHQUFHLEdBQVcsTUFBTSxDQUFDLFlBQVksQ0FBQztJQUN0QyxJQUFJLEVBQUUsTUFBTTtJQUNaLFdBQVcsRUFBRSxNQUFNLENBQUMsY0FBYztJQUNsQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUk7Q0FDbkIsQ0FBQyxDQUFDO0FBRUgsSUFBSSxZQUEwQixDQUFDO0FBQy9CLElBQUk7SUFDRixNQUFNLG9CQUFvQixHQUFHLElBQUksb0JBQW9CLENBQUMsZUFBZSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDL0UsWUFBWSxHQUFHLElBQUksWUFBWSxDQUFDLE9BQU8sRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0NBQ2hFO0FBQUMsT0FBTyxLQUFLLEVBQUU7SUFDZCxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDcEMsTUFBTSxLQUFLLENBQUM7Q0FDYjtBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixZQUFZLEVBQUUsWUFBWSxDQUFDLE9BQU87Q0FDbkMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFF1b3RlSGFuZGxlckluamVjdG9yIH0gZnJvbSBcIi4vcXVvdGUvaW5qZWN0b3JcIjtcbmltcG9ydCB7IFF1b3RlSGFuZGxlciB9IGZyb20gXCIuL3F1b3RlL3F1b3RlXCI7XG5pbXBvcnQgeyBkZWZhdWx0IGFzIGJ1bnlhbiwgZGVmYXVsdCBhcyBMb2dnZXIgfSBmcm9tIFwiYnVueWFuXCI7XG5cbmNvbnN0IGxvZzogTG9nZ2VyID0gYnVueWFuLmNyZWF0ZUxvZ2dlcih7XG4gIG5hbWU6IFwiUm9vdFwiLFxuICBzZXJpYWxpemVyczogYnVueWFuLnN0ZFNlcmlhbGl6ZXJzLFxuICBsZXZlbDogYnVueWFuLklORk8sXG59KTtcblxubGV0IHF1b3RlSGFuZGxlcjogUXVvdGVIYW5kbGVyO1xudHJ5IHtcbiAgY29uc3QgcXVvdGVJbmplY3RvclByb21pc2UgPSBuZXcgUXVvdGVIYW5kbGVySW5qZWN0b3IoXCJxdW90ZUluamVjdG9yXCIpLmJ1aWxkKCk7XG4gIHF1b3RlSGFuZGxlciA9IG5ldyBRdW90ZUhhbmRsZXIoXCJxdW90ZVwiLCBxdW90ZUluamVjdG9yUHJvbWlzZSk7XG59IGNhdGNoIChlcnJvcikge1xuICBsb2cuZmF0YWwoeyBlcnJvciB9LCBcIkZhdGFsIGVycm9yXCIpO1xuICB0aHJvdyBlcnJvcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHF1b3RlSGFuZGxlcjogcXVvdGVIYW5kbGVyLmhhbmRsZXIsXG59O1xuIl19