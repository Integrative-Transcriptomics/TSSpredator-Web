
package json;

import main.Main;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class JSONparser {

    public static Main parse(String json) {

        // hier werden Parameter/Einagben gepseichert
        Map<String, String> values = new HashMap<>();

        boolean loadConfig = false;
        boolean saveConfig = false;

        JSONObject object = new JSONObject(json);
        JSONArray keys = object.names();

        for(int i = 0; i < keys.length(); i++) {

            String key = keys.getString((i));
            String value = object.getString(key);

            if(key.equals("loadConfig")) {
                loadConfig = Boolean.parseBoolean(value);

            } else if (key.equals("saveConfig")) {
               saveConfig = Boolean.parseBoolean(value);

            // Parameter/Dateipfade abspeichern
            } else {
                values.put(key, value);
            }
        }
        return new Main(loadConfig, saveConfig, values);
    }
}
