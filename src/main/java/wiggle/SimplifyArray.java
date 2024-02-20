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
        double scale = 1;
        if (XYnorm.minNormValue != Integer.MAX_VALUE) {
            scale = XYnorm.minNormValue;
        }

        double strand = array[0];

        if (strand == 0) {
            strand = 1; // keep values as they are
        }

        int start = 1;
        double currentValue = array[start] * scale;
        for (int i = 2; i < array.length - 1; i++) {
            double value = array[i] * scale;
            if (value != currentValue) {
                if (currentValue != 0) {
                    result.add(new Range(start, i - 1, currentValue));
                }
                currentValue = value;
                start = i;
            }
        }

        // Add the last sequence
        result.add(new Range(start, array.length - 1, currentValue));

        return result;
    }

}