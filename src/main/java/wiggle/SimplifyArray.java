package wiggle;

import java.util.ArrayList;
import java.util.List;

public class SimplifyArray {

    public static class Range {
        int start;
        int end;
        double value;

        public Range(int start, int end, double value) {
            this.start = start;
            this.end = end;
            this.value = value;
        }

        @Override
        public String toString() {
            return start + "\t" + end + "\t" + value;
        }
    }

    public static List<Range> simplifyArray(double[] array) {
        List<Range> result = new ArrayList<>();
        if (array == null || array.length == 0) {
            return result;
        }

        int start = 0;
        double currentValue = array[0];

        for (int i = 1; i < array.length; i++) {
            if (array[i] != currentValue) {
                result.add(new Range(start, i - 1, currentValue));
                currentValue = array[i];
                start = i;
            }
        }

        // Add the last sequence
        result.add(new Range(start, array.length - 1, currentValue));

        return result;
    }

}