export default async () => {
  if (global.__MONGOSERVER__) {
    await global.__MONGOSERVER__.stop()
  }
}
