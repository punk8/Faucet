export class VerifyTwitter {

    middleware = (req: any, res: any, next: () => void) => this.verifyTwitter(req, res, next)

    constructor(app: any) {
    }

    async verifyTwitterContent(twitterLink: string): Promise<boolean> {

        return false
    }

    async shouldAllow(twitterLink: string | null): Promise<boolean> {
        if (twitterLink) {
            if (twitterLink.startsWith("https://twitter.com")) {
                if (await this.verifyTwitterContent(twitterLink)) {
                    return true
                }
            }
        }
        return true
    }

    async verifyTwitter(req: any, res: any, next: () => void) {
        const shouldAllow = await this.shouldAllow(req?.body?.twitterLink)
        if (shouldAllow) {
            next()
        } else {
            return res.status(400).send({ message: "Twitter verification failed!" })
        }
    }
}