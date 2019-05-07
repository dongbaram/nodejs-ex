import sys,json,numpy as np

def read_in():
    lines = sys.stdin.readlines()   #파라미터를 읽음
    return json.loads(lines[0])     #첫줄을 리턴
def main():
    param_data = read_in()
    arg1 = param_data["param1"]
    #arg2 = param_data["param2"]
    #np_lines = np.array(lines)
    #lines_sum = np.sum(np_lines)
    result_ocr = "Result OCR "
    #return_date = [{"param1":arg1},{"param1":arg2},{"return":result_ocr}]

    print(arg1)


if __name__ == "__main__":
    main()
