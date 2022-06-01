package json;

import main.Main;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

/**
 * parses JSON string and saves input parameters in HashMap
 */
public class JSONparser {

    public static Main parse(String json) {

        // saves parameters/input
        Map<String, String> values = new HashMap<>();

        boolean loadConfig = false;
        boolean saveConfig = false;
        boolean readAlignment = false;

        JSONObject object = new JSONObject(json);
        JSONArray keys = object.names();

        for(int i = 0; i < keys.length(); i++) {

            String key = keys.getString((i));
            String value = object.getString(key);

            // read given config file
            if(key.equals("loadConfig")) {
                loadConfig = Boolean.parseBoolean(value);

            // write config file for given parameters
            } else if (key.equals("saveConfig")) {
                saveConfig = Boolean.parseBoolean(value);

            // read given alignment file
            } else if (key.equals("loadAlignment")) {
                readAlignment = Boolean.parseBoolean(value);
            // save file path/parameter
            } else {
                values.put(key, value);
            }
        }
        return new Main(loadConfig, saveConfig, readAlignment, values);
    }
}
