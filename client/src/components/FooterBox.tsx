import AddNetwork from "./AddNetwork"

import './styles/CopyToClipboard.css'
import './styles/FooterBox.css'

function copyToClipboard(): void {
    let copyText = document.getElementById("return-address-input") as HTMLInputElement
    copyText.select()
    copyText.setSelectionRange(0, 100)
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(copyText.value);
    } else {
        navigator.clipboard.writeText(copyText.value)
    }

    let tooltip = document.getElementById("tooltip-text") as HTMLSpanElement
    tooltip.innerHTML = "Copied"
}

function fallbackCopyTextToClipboard(text: string) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
    } catch (err) {
        // console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
}

function outFunc(): void {
    let tooltip = document.getElementById("tooltip-text") as HTMLSpanElement
    tooltip.innerHTML = "Copy to clipboard"
}

export default function FooterBox(props: any) {
    return (
        <div className="container">
            <div className="footer-box">
                <div style={{ fontSize: "13px", padding: "20px" }}>
                    Use the buttons below to add <b>{props.chainConfigs[props.chain!]?.NAME}</b> to your browser wallet extension
                    or visit the Subnet's block explorer.
                    <AddNetwork config={props.chainConfigs[props.chain!]} token={props.chainConfigs[props.token!]} />
                </div>
            </div>

            <div className='footer-box'>
                <div style={{ fontSize: "13px", padding: "20px" }}>
                    Once you are done with the testing, feel free to send the remaining coins
                    to the following faucet address.

                    <div className='return-address' onMouseOut={outFunc} onClick={copyToClipboard}>
                        <div className="tooltip">
                            <span className="tooltiptext" id="tooltip-text">Copy to clipboard</span>
                        </div>

                        <input id="return-address-input" value={props.faucetAddress} disabled />

                        <span style={{ marginRight: "10px", marginTop: "2px" }}>
                            <img alt="copy" style={{ width: "20px", height: "20px" }} src="https://img.icons8.com/fluency-systems-regular/48/ffffff/copy.png" />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}