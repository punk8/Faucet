const axios = require('axios')
const puppeteer = require('puppeteer');

export class VerifyTwitter {

    middleware = (req: any, res: any, next: () => void) => this.verifyTwitter(req, res, next)

    tryTimes: number

    constructor(app: any) {
        this.tryTimes = 3
    }

    sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async initPage(): Promise<any> {
        const options = { headless: true }
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36");
        return page
    }

    async getElementByXpath(page: any, xpath: string): Promise<any> {
        // let share = null
        // for (let i = 0; i < this.tryTimes; i++) {
        //     share = await page.$x(xpath);
        //     if (share == null || share.length == 0) {
        //         console.log(`Waiting ${i} seconds...`);
        //         await this.sleep(i * 1000);
        //     } else {
        //         goOn = true
        //     }
        // }
    }

    async searchTwitter(url: string): Promise<boolean> {
        let goOn = false
        let postTime = null
        let share = null
        let at_ = null

        const page = await this.initPage()
        await page.goto(url)
        await page.setViewport({
            width: 10000,
            height: 10000
        });

        // text
        const share_xpath = '//html/body/div[1]/div/div/div[2]/main/div/div/div/div/div/section/div/div/div[1]/div/div/article/div/div/div[3]/div[2]/div/div/div[2]/a'
        const at_xpath = '//html/body/div[1]/div/div/div[2]/main/div/div/div/div/div/section/div/div/div[1]/div/div/article/div/div/div[3]/div[1]/div/div[1]/div/span/a'
        const xpath = '//time'

        for (let i = 0; i < this.tryTimes; i++) {
            share = await page.$x(share_xpath);
            if (share == null || share.length == 0) {
                console.log(`Waiting ${i} seconds...`);
                await this.sleep(i * 1000);
            } else {
                goOn = true
            }
        }

        if (!goOn) {
            return false
        }

        goOn = false
        for (let i = 0; i < this.tryTimes; i++) {
            at_ = await page.$x(at_xpath);
            if (at_ == null || at_.length == 0) {
                console.log(`Waiting ${i} seconds...`);
                await this.sleep(i * 1000);
            } else {
                goOn = true
            }
        }

        if (!goOn) {
            return false
        }
        goOn = false
        for (let i = 0; i < this.tryTimes; i++) {
            await page.evaluate(() => {
                window.scrollTo(0, 200);
            });
            postTime = await page.$x(xpath);
            if (postTime == null || postTime.length == 0) {
                console.log(`Waiting ${i} seconds...`);
                await this.sleep(i * 1000);
            } else {
                goOn = true
            }
        }
        if (!goOn) {
            return false
        }
        const share_link = await page.evaluate((el: { href: any; }) => {
            return el.href;
        }, share[0]);
        const at_element = await page.evaluate((el: { href: any; }) => {
            return el.href;
        }, at_[0]);
        const text = await page.evaluate((el: { dateTime: any; }) => {
            return el.dateTime;
        }, postTime[0]);

        console.log("postTime", text)
        console.log("sharelink", share_link)
        console.log("@", at_element)

        if (share_link === 'https://t.co/d7Nu52ul0q' && at_element === 'https://twitter.com/QuickNode') {
            return true
        } else {
            return false
        }
    }

    async verifyTwitterContent(twitterLink: string): Promise<boolean> {
        let response
        try {
            return await this.searchTwitter(twitterLink)
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