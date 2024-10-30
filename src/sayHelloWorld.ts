export function SayHelloWorld(current: Date) {
    console.info('Hello World');
    console.info(`The current time is ${current.getHours()}:${current.getMinutes()}:${current.getSeconds()}`);
}