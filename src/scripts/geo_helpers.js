//https://www.codegrepper.com/code-examples/javascript/javascript+random+point+on+unit+sphere
function randomSpherePoint(x0, y0, z0, radius) {
    let u = Math.random();
    let v = Math.random();
    let theta = 2 * Math.PI * u;
    let phi = Math.acos(2 * v - 1);
    let x = x0 + (radius * Math.sin(phi) * Math.cos(theta)) * Math.random();
    let y = y0 + (radius * Math.sin(phi) * Math.sin(theta)) * Math.random();
    let z = z0 + (radius * Math.cos(phi)) * Math.random();
    return [x, y, z];
}

function randomSphereSurface (x0, y0, z0, radius) {
    let u = Math.random();
    let v = Math.random();
    let theta = 2 * Math.PI * u;
    let phi = Math.acos(2 * v - 1);
    let x = x0 + (radius * Math.sin(phi) * Math.cos(theta));
    let y = y0 + (radius * Math.sin(phi) * Math.sin(theta));
    let z = z0 + (radius * Math.cos(phi));
    return [x, y, z];
}

//https://mathworld.wolfram.com/LogarithmicSpiral.html
function galaxyGenerator ( x0, y0, z0, radius){

    let verticaNoise = 2;
    let horizontalNoise = 2;

    let reverse = 1;
    if( Math.random() > 0.49){
        reverse = -1;
    }

    let theta = 2 * Math.PI * Math.random();
    let a = 0.5;
    let b = 0.5;

    let u = Math.random();
    let v = Math.random();
    let beta = 2 * Math.PI * u;
    let phi = Math.acos(2 * v - 1);

    if( Math.random() < 0.3 ){
        let x = x0 + (radius * Math.sin(phi) * Math.cos(theta) * Math.random()) ;
        let y = y0 + (( verticaNoise + 1)  * Math.sin(phi) * Math.sin(theta) * Math.random());
        let z = z0 + (radius * Math.cos(phi) * Math.random());
        return [x, y, z];
    }else{
        let x = x0 + reverse * ( a * Math.cos( theta) * Math.pow(Math.E, ( b *  theta)) ) + horizontalNoise * Math.sin(phi) * Math.cos(beta) * Math.random();
        let z = z0 + reverse * ( a * Math.sin(theta) * Math.pow(Math.E, ( b * theta)) ) + horizontalNoise * Math.sin(phi) * Math.sin(beta) * Math.random();
        let y = y0 + verticaNoise * Math.cos(phi) * Math.random();
        return [x, y, z];
    }
}

function randomCircleArc (x0, y0, z0, radius) {
    let theta = 2 * Math.PI * Math.random();
    let x = x0 + (radius * Math.sin(theta));
    let y = y0;
    let z = z0 + (radius * Math.cos(theta));
    return [x, y, z];
}

function randomCircle (x0, y0, z0, radius) {
    let theta = 2 * Math.PI * Math.random();
    let x = x0 + (radius * Math.sin(theta)) * Math.random();
    let y = y0;
    let z = z0 + (radius * Math.cos(theta)) * Math.random();
    return [x, y, z];
}


export {randomSpherePoint, randomSphereSurface, galaxyGenerator, randomCircleArc, randomCircle};