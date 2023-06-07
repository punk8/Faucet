const axios = require('axios')
const puppeteer = require('puppeteer');

export class VerifyTwitter {

    middleware = (req: any, res: any, next: () => void) => this.verifyTwitter(req, res, next)

    constructor(app: any) {

    }





    async searchTwitter(url: string) {
        const options = { headless: false }
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        // url = 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section'
        await page.goto(url)
        await page.setViewport({
            width: 1200,
            height: 800
        });
        const xpath = '//time'

        let postTime = await page.$x(xpath);
        console.log("postTime", postTime)
        postTime = null

        while (postTime == null || postTime.length == 0) {
            await page.evaluate(() => {
                window.scrollTo(0, 200);
            });
            postTime = await page.$x(xpath);
        }

        const text = await page.evaluate((el: { dateTime: any; }) => {
            return el.dateTime;
        }, postTime[0]);

        console.log("postTime", text)
        // await page.waitForSelector(xpath);
        // console.log("searchTime")
        // try {
        //     const text = await page.$eval(xpath, (ele: any) => ele.datetime)
        //     console.log("searchTime", text)
        // } catch (e) {
        //     console.log('Timed out')
        // }

    }

    async verifyTwitterContent(twitterLink: string): Promise<boolean> {
        let response
        try {
            await this.searchTwitter(twitterLink)
            // response = await axios.get(twitterLink)
            // response = await axios.get("https://baidu.com")
            console.log(response)
        } catch (err: any) {
            console.log("verifyTwitterContent error:", err?.message)
        }
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
        return false
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