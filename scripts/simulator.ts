import { exec } from "child_process";
import { BigNumber, BigNumberish } from "ethers";

async function execCommand(cmd: string) {
    // let returnData: any = nill
    return exec(cmd, (error, stdout, stderr) => {
        if (error) {
            // console.log(`error: ${error.message}`);
            return null;
        }
        if (stderr) {
            // console.log(`stderr: ${stderr}`);
            return null;
        }
        console.log(`stdout: ${stdout}`);
        return stdout;
    });
}

async function simulate(from: string, to: string, value: BigNumberish, data: string) {
    const cmd = `forge script scripts/Simulator.s.sol:Simulator --sig "simulate(address,address,uint,bytes memory)" "${from}" "${to}" "${value}" "${data}"`;
    console.time("cmd");
    const returnData = await execCommand(cmd);
    console.timeEnd("cmd");
    // console.log(returnData);
}

async function main() {
    await simulate("0x43b02cdF22d0DE535279507CF597969Ce82198Af", "0x43b02cdF22d0DE535279507CF597969Ce82198Af", 0, "0x");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});