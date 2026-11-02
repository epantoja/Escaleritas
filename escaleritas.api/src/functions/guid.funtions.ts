
const GenerarGuid = () => {
    const newGuid = () => {
        let result: string;
        let i: string;
        let j: number;

        result = "";
        for (j = 0; j < 32; j+=1) {
            if (j === 8 || j === 12 || j === 16 || j === 20)
                result = `${result}-`;
            i = Math.floor(Math.random() * 16).toString(16).toUpperCase();
            result = `${result}${i}`;
        };
        return result;
    }

    return {
        newGuid,
    };
};

export default GenerarGuid;
