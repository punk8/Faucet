export class VerifyTwitter {

    middleware = (req: any, res: any, next: () => void) => this.verifyTwitterContent(req, res, next)

    constructor(app: any) {
    }

    async shouldAllow(twitterLink: string | null): Promise<boolean> {
        return false
    }


    async verifyTwitterContent(req: any, res: any, next: () => void) {
        const shouldAllow = await this.shouldAllow(req?.body?.twitterLink)
        if (shouldAllow) {
            next()
        } else {
            return res.status(400).send({ message: "Twitter verification failed!" })
        }
    }
}