const axios = require('axios')
// const puppeteer = require('puppeteer');

let chrome: any;
let puppeteer: any;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    chrome = require("chrome-aws-lambda");
    puppeteer = require("puppeteer-core");
} else {
    puppeteer = require("puppeteer");
}

export class VerifyTwitter {

    middleware = (req: any, res: any, next: () => void) => this.verifyTwitter(req, res, next)

    tryTimes: number
    share_url: string
    at_url: string
    browser: any;

    constructor(app: any, share_url: string, at_url: string) {
        this.tryTimes = 5
        this.share_url = share_url
        this.at_url = at_url
    }
    async initPage(): Promise<any> {
        await this.openBrowser();
        const page = await this.browser.newPage();
        page.setUserAgent("Mozilla/5.0 (Windows NT 10.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36");

        //需要先设置 setRequestInterception 为 true
        //因为默认情况下 request 只可读
        await page.setRequestInterception(true);
        page.on("request", (req: any) => {
            if (
                req.resourceType() == "stylesheet" ||
                req.resourceType() == "font" ||
                req.resourceType() == "image"
            ) {
                req.abort();
            } else {
                req.continue();
            }
        });

        return page
    }
    async openBrowser(): Promise<any> {
        if (!this.browser) {
            let options = {}
            if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
                options = {
                    args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
                    defaultViewport: chrome.defaultViewport,
                    executablePath: await chrome.executablePath,
                    headless: true,
                    ignoreHTTPSErrors: true,
                };
            } else {
                options = {
                    headless: true,
                    args: ['--no-sandbox',
                        '--disable-setuid-sandbox',
                        // '–disable-gpu',
                        // '–disable-dev-shm-usage',
                        // '–no-first-run',
                        // '–no-zygote',
                        '–single-process'
                    ]
                }
            }
            this.browser = await puppeteer.launch(options);
            this.browser.on("disconnected", () => {
                console.log("浏览器断开连接");
                //断开后设为 falsy 值
                this.browser = null;
            });
        } else {
            console.log("浏览器已经打开，不需要重新打开");
        }
    };

    async getElementByXpath(page: any, xpath: string): Promise<any> {
        let element = null
        for (let i = 0; i < this.tryTimes; i++) {
            element = await page.$x(xpath);
            if (element == null || element.length == 0) {
                console.log(`getElement Waiting ${i} seconds...`);
                await this.sleep(i * 1000);
            }
        }
        return element
    }

    async searchTwitter(url: string): Promise<boolean> {
        let postTime = null
        let share = null
        let at_ = null

        const page = await this.initPage()
        console.log("打开url", url)
        await page.goto(url)
        await page.setViewport({
            width: 1000,
            height: 1000
        });

        // text
        const share_xpath = '//html/body/div[1]/div/div/div[2]/main/div/div/div/div/div/section/div/div/div[1]/div/div/article/div/div/div[3]/div[2]/div/div/div[2]/a'
        const at_xpath = '//html/body/div[1]/div/div/div[2]/main/div/div/div/div/div/section/div/div/div[1]/div/div/article/div/div/div[3]/div[1]/div/div[1]/div/span/a'
        const xpath = '//time'

        console.log("check share");
        share = await this.getElementByXpath(page, share_xpath);
        if (share == null || share.length == 0) {
            console.log('share not found')
            return false
        }

        console.log("check @");
        at_ = await this.getElementByXpath(page, at_xpath);
        if (at_ == null || at_.length == 0) {
            console.log('at_ not found')
            return false
        }

        console.log("check postTime");
        postTime = await this.getElementByXpath(page, xpath);
        if (postTime == null || postTime.length == 0) {
            console.log('postTime not found')
            return false
        }

        const share_link = await page.evaluate((el: { href: any; }) => {
            return el.href;
        }, share[0]);
        const at_element = await page.evaluate((el: { href: any; }) => {
            return el.href;
        }, at_[0]);
        const time = await page.evaluate((el: { dateTime: any; }) => {
            return el.dateTime;
        }, postTime[0]);

        console.log("postTime %s,sharelink %s, @ %s", time, share_link, at_element)
        return this.verify(time, share_link, at_element)
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


    sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    verify(time: any, share_link: string, at_element: string): boolean {
        const date = new Date(time)
        // 判断时间
        if (date != new Date()) { // 不是当天
            return false
        }

        // 判断@对象
        if (at_element != this.at_url) {
            return false
        }
        // 判断分享链接
        if (share_link != this.share_url) {
            return false
        }

        console.log('verify done!')
        return true

    }
}