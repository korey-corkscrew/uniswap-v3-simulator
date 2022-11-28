function testing(x: number, y: number) {
    x--;
    y++;
}

async function main() {
    let x = 55;
    let y = 10;
    testing(x, y);
    console.log(x, y);
}

main();