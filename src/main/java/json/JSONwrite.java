package json;

import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/**
 * saves input/parameters from Map in JSON string -> send to frontend
 */

public class JSONwrite {

    public static String write(Map<String, String> values) {

        List<String> keys = new LinkedList<String>(values.keySet());
        Collections.sort(keys);

        String json = "{";

        for (String key : keys) {

            json += "\"" + key + "\": \"" + values.get(key) + "\",";
        }

        // remove last comma
        json = json.substring(0, json.length() - 1);
        json += "}";

        return json;
    }
}