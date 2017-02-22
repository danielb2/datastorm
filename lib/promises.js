'use strict';


exports.wrap = function (bind, method, args) {

    return new Promise((resolve, reject) => {

        const callback = (result) => {

            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        };
        callback.wrapped = true;

        method.apply(bind, args ? args.concat(callback) : [callback]);
    });
};


exports.return = function (cb, err, result) {

    if (cb.wrapped) {
        if (err instanceof Error) {
            return cb(err);
        }
        if (err) {
            return cb(new Error(err));
        }
        return cb(result);
    }

    if (err) {
        return cb(err);
    }

    return cb(err, result);
};
