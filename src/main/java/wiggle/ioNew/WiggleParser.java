
package wiggle.ioNew;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedList;

import utils.ioNew.EGeneIdentifier;
import utils.ioNew.Pair;
import utils.ioNew.Utils;
import wiggle.ioNew.WiggleParserExeption;

import javax.sql.rowset.serial.SerialRef;

/**
 * master-thesis-sfillinger
 * Description:
 *
 * @author fillinger
 * @version ${VERSION}
 *          Date: 1/18/16
 *          EMail: sven.fillinger@student.uni-tuebingen.de
 */
public class WiggleParser {

    public static String trackInformation = "";

    private static final String WIG_STANDARD_CHROMOSOME_ID = "chrom";

/*    public static LinkedHashMap<String, LinkedList<Pair<Integer, Double>>> parseWiggleFile(String wiggleFileName, EGeneIdentifier identifier) throws WiggleParserExeption{

        LinkedHashMap<String, LinkedList<Pair<Integer, Double>>> wiggleFileEntries = new LinkedHashMap<>();

        Path wiggleFile = FileSystems.getDefault().getPath(wiggleFileName);

        try(BufferedReader br = Files.newBufferedReader(wiggleFile)){
            String line;
            String id = null;
            LinkedList<Pair<Integer, Double>> genomicPositionExpression = new LinkedList<>();

            while((line = br.readLine()) != null){
                if(line.startsWith("track")){
                    // 1st line, the track information line
                    trackInformation = line;
                    continue;
                }
                if(line.startsWith("variableStep")) {
                    if (!genomicPositionExpression.isEmpty() && id != null){
                        // We already have an wiggle entry filled previously
                        // Put it in the Map with the id and
                        wiggleFileEntries.put(id, genomicPositionExpression);
                        genomicPositionExpression = new LinkedList<>();

                    }
                    if (line.contains("span") && getSpanWidth(line) != 1) {
                            throw new WiggleParserExeption("TSSpredator doesn't support span parameter >1 yet");
                    } else {
                        
                        The content parsing
                         
                        try {
                            id = findChromosomeName(line);
                            // Check, if GI is in header
                            if(Utils.getSeqID(id, identifier) != null){
                                id = Utils.getSeqID(id, identifier);
                            }
                        } catch (IOException e) {
                            throw new WiggleParserExeption(e.getMessage());
                        }
                    }
                } else if(line.startsWith("fixedStep")){
                    throw new WiggleParserExeption("TSSpredator doesn't support fixedStep yet.");
                } else {
                    if(line.trim().isEmpty()){
                        // Dummy entry, for empty wiggle entries,
                        // where variableStep line exists, but there is
                        // no expression information (empty line)
                        genomicPositionExpression.add(new Pair<>(0, 0.0));
                        continue;
                    }
                    // if we are reading out a current chromosome
                    String[] positionExpressionPair = line.trim().split("[\\s]+");
                    genomicPositionExpression.add(
                            new Pair<>(Integer.parseInt(positionExpressionPair[0].trim()),
                                       Double.parseDouble(positionExpressionPair[1].trim())));
                }
            }
            // Final push
            wiggleFileEntries.put(id, genomicPositionExpression);

        } catch (IOException e){
            String errorMsg = String.format("Could not open file %s", wiggleFile);
            throw new WiggleParserExeption(errorMsg, e);
        }
        return wiggleFileEntries;
    }*/
    
    public static LinkedHashMap<String, LinkedList<Pair<Integer, Double>>> parseWiggleFileNew(String wiggleFileName, String identifier) throws WiggleParserExeption{

        LinkedHashMap<String, LinkedList<Pair<Integer, Double>>> wiggleFileEntries = new LinkedHashMap<>();

        Path wiggleFile = FileSystems.getDefault().getPath(wiggleFileName);

        try(BufferedReader br = Files.newBufferedReader(wiggleFile)){
            String line;
            String id = null;
            LinkedList<Pair<Integer, Double>> genomicPositionExpression = new LinkedList<>();

            while((line = br.readLine()) != null){
                if(line.startsWith("track")){
                    // 1st line, the track information line
                    trackInformation = line;
                    continue;
                }
                if(line.startsWith("variableStep")) {
                    if (!genomicPositionExpression.isEmpty() && id != null){
                        // We already have an wiggle entry filled previously
                        // Put it in the Map with the id and
                        wiggleFileEntries.put(id, genomicPositionExpression);
                        genomicPositionExpression = new LinkedList<>();

                    }
                    if (line.contains("span") && getSpanWidth(line) != 1) {
                            throw new WiggleParserExeption("TSSpredator doesn't support span parameter >1 yet");
                    } else {
                        /*
                        The content parsing
                         */
                        try {
                            id = findChromosomeName(line);
                            // Check, if GI is in header
                            //if(Utils.getSeqIDNew(id, identifier) != null){
                            //    id = Utils.getSeqIDNew(id, identifier);
                                //System.out.println("ID in wiggleParser: " + id);
                            //}
                        } catch (IOException e) {
                            throw new WiggleParserExeption(e.getMessage());
                        }
                    }
                } else if(line.startsWith("fixedStep")){
                    throw new WiggleParserExeption("TSSpredator doesn't support fixedStep yet.");
                } else {
                    if(line.trim().isEmpty()){
                        // Dummy entry, for empty wiggle entries,
                        // where variableStep line exists, but there is
                        // no expression information (empty line)
                        genomicPositionExpression.add(new Pair<>(0, 0.0));
                        continue;
                    }
                    // if we are reading out a current chromosome
                    String[] positionExpressionPair = line.trim().split("[\\s]+");
                    genomicPositionExpression.add(
                            new Pair<>(Integer.parseInt(positionExpressionPair[0].trim()),
                                       Double.parseDouble(positionExpressionPair[1].trim())));
                }
            }
            // Final push
            wiggleFileEntries.put(id, genomicPositionExpression);
            //System.out.println("wiggleEntry: " + wiggleFileEntries.size());

        } catch (IOException e){
            String errorMsg = String.format("Could not open file %s", wiggleFile);
            throw new WiggleParserExeption(errorMsg, e);
        }
        return wiggleFileEntries;
    }


    /**
     * Gets a variableStep line and tries to find the key:value pair for
     * the chromosome name.
     * @param line The wiggle file line that should contain this info
     * @return The chromosome name
     * @throws IOException Throw an IOEsception when
     */
    private static String findChromosomeName(String line) throws IOException{
        String chromosomeName = "";

        String[] lineContent = line.split(" ");

        HashMap<String, String> keyValuePairs = new HashMap<>();

        for(String content : lineContent){
            if(content.contains("=")){
                //keyValue pair found
                String[] keyValuePair = content.split("=");
                //System.out.println("pair1: " + keyValuePair[0] + " pair2: " + keyValuePair[1]);
                keyValuePairs.put(keyValuePair[0], keyValuePair[1]);
            }
        }

        if(keyValuePairs.containsKey(WIG_STANDARD_CHROMOSOME_ID)){
        	//System.out.println("sizeHashMap: " + keyValuePairs.size());
        	//System.out.println("wig_standard " + WIG_STANDARD_CHROMOSOME_ID);
        	chromosomeName = keyValuePairs.get(WIG_STANDARD_CHROMOSOME_ID);
        	//System.out.println("chromname: " + chromosomeName );
        } else{
            throw new IOException(String.format("Key %s not found", WIG_STANDARD_CHROMOSOME_ID));
        }

        return chromosomeName;
    }


    /**
     * Extract the span width of the wiggle entry
     * @param line The variable step line
     * @return The span width as int
     */
    private static int getSpanWidth(String line){
        String[] lineContent = line.split(" ");

        HashMap<String, String> keyValuePairs = new HashMap<>();

        for(String content : lineContent){
            if(content.contains("=")){
                keyValuePairs.put(content.split("=")[0], content.split("=")[1]);
            }
        }

        return Integer.parseInt(keyValuePairs.get("span"));
    }




}
