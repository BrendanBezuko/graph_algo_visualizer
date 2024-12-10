function print2DArray(array) {
    //print matrix for debugging
    let arrTxt = ''
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array.length; j++) {
            let num = array[i][j];
            num = num.toFixed(1);
            num = num.padStart(5, ' ');
            num = num.padEnd(6, ' ');
            arrTxt += num;
        }
        arrTxt += '\n\n';
    }
    console.log(arrTxt);
}

export { print2DArray };