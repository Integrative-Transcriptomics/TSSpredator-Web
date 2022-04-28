
package json;

import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/**
 * speichert Eingaben als JSON-String, um ihn ans frontend zu schicken
 * frontend stellt eingaben dann dar
 */

public class JSONwrite {

    public static String write(Map<String, String> values) {

        List<String> keys = new LinkedList<String>(values.keySet());
        Collections.sort(keys);

        String json = "{";


        for (String key : keys) {

            json += "\"" + key + "\": \"" + values.get(key) + "\",";
        }

        // letzte Komma entfernen
        json = json.substring(0, json.length() - 1);
        json += "}";

        return json;
    }
}
