
package utils.ioNew;

import java.util.LinkedHashMap;
import java.util.LinkedList;
import utils.ioNew.Pair;

/**
 * master-thesis-sfillinger
 * Description:
 *
 * @author fillinger
 * @version ${VERSION}
 *          Date: 1/19/16
 *          EMail: sven.fillinger@student.uni-tuebingen.de
 */
public class Utils {

    /**
     * Searches for an sequence identifier (GI format) in
     * a line with format like gi|6373737|....
     * @param information The String which hopefully contains the GI
     * @param identifier The type of identifier used
     * @return The GI or null, if not found
     */
    public static String getSeqID(String information, String identifier) {

        String[] content = information.split("\\|");

        boolean foundGI = false;

        for(String ids : content){
            if(ids.equalsIgnoreCase(identifier.toString())){
                foundGI = true;
            } else if(foundGI){
                return ids;
            }
        }
        return information.trim();
    }
    
    /**
     *second version of getSeqID
     */
    public static String getSeqIDNew(String information, String identifier) {
    	/*String[] content = information.split(" ");

        boolean foundIdentifier getSeqIDNew= false;
        
        for (String ids : content) {
        	if(ids.equalsIgnoreCase(identifier)) {
        		System.out.println("id: " + identifier);
        		System.out.println("ids: "+ ids);
        		foundIdentifier = true;
        	} else if (foundIdentifier) {
        		return ids;
        	}
        }*/
    	boolean foundIdentifier = false;
        if(information.contains(identifier)){
        	//System.out.println("Information: " + information);
        	//System.out.println("Identifier: " + identifier);
           foundIdentifier = true;
        } else if(foundIdentifier){
        	//System.out.println("test: " + identifier);
        	return identifier;
        }
        return identifier.trim();
        //return "h";
    }

    
    /**
     *third version of getSeqID
     */
    public static String getSeqID3 (String information, EGeneIdentifier identifier) {

    	//String[] content = information.split("\\|");

        boolean foundGI = false;
        if(information.contains(identifier.toString())){
                foundGI = true;
            } else if(foundGI){
            	return identifier.toString();
            }
        return information.trim();
    }


    /**
     * Cloning of the LinkedHashMap
     * @param targetMap The Map to clone
     * @return A deeper copy of targetMap
     */
    public static LinkedHashMap<String, String> cloneLinkedHashMap (LinkedHashMap<String, String> targetMap){
        LinkedHashMap<String, String> newMap = new LinkedHashMap<>();
        for (String key : targetMap.keySet()) {
            newMap.put(key, targetMap.get(key));
        }
        return newMap;
    }


    /**
     * Cloning of the LinkedHashMap returned from WiggleParser
     * @param targetMap The Map to clone
     * @return A deeper copy of the targetMap
     */
    public static LinkedHashMap<String, LinkedList<Pair<Integer, Double>>> cloneLinkedHashMapWiggle (LinkedHashMap<String, LinkedList<Pair<Integer, Double>>> targetMap){
        LinkedHashMap<String, LinkedList<Pair<Integer, Double>>> newMap = new LinkedHashMap<>();
        for(String key : targetMap.keySet()){
            LinkedList<Pair<Integer, Double>> copyList = new LinkedList<>();
            for(Pair<Integer, Double> pair : targetMap.get(key)){
                Pair<Integer, Double> copyPair = new Pair<>(pair.getKey(), pair.getValue());
                copyList.add(copyPair);
            }
            newMap.put(key, copyList);
        }
        return newMap;
    }
}
