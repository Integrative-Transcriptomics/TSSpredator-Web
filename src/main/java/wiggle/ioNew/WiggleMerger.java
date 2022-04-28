
package wiggle.ioNew;

import fasta.ioNew.FASTAMerger;
import utils.ioNew.Pair;
import utils.ioNew.Utils;
import wiggle.ioNew.WiggleMerger;
import wiggle.ioNew.WiggleMergerException;

import java.util.*;

/**
 * master-thesis-sfillinger
 * Description:
 *
 * @author fillinger
 * @version ${VERSION}
 *          Date: 1/18/16
 *          EMail: sven.fillinger@student.uni-tuebingen.de
 */
public class WiggleMerger {

    /**
     * Default value for the track information
     */
    private final String DEFAULT_TRACK = "track type=wiggle_0 name=\"not specified\"";

    /**
     * Default value for the variableStep information
     */
    private final String DEFAULT_VARIABLESTEP = "variableStep chrom=unspecifiedChromosome";

    /**
     * The fasta entries
     */
    private Map<String, String> fastaEntries;

    /**
     * The wiggle entries
     */
    private Map<String, LinkedList<Pair<Integer, Double>>> wiggleEntries;

    /**
     * The final merged super wiggle
     */
    private double[] superWiggle;

    /**
     * The final merged super FASTA file
     */
    private Map<String, String> superFASTA;

    /**
     * Sets the default track infromation
     */
    private String trackInformation = DEFAULT_TRACK;

    /**
     * Sets the default chromosome information for variableSteps
     */
    private String variableStep = DEFAULT_VARIABLESTEP;

    private FASTAMerger fastaMergerInstance;

    /**
     * Nullary Constructor
     */
    public WiggleMerger(){}

    /**
     * Set the FASTA HashMap
     * @param fastaEntries A LinkedHashMap containing the FASTA Entries and IDs
     * @return this
     */
    public WiggleMerger setFASTAmap(LinkedHashMap<String, String> fastaEntries){
        // deep clone map, to be sure
        this.fastaEntries = Collections.unmodifiableMap(Utils.cloneLinkedHashMap(fastaEntries));
        return this;
    }

    /**
     * Set the WIGGLE HashMap
     * @param wiggleMap A LinkedHashMap containing the wiggle entries
     * @return this
     */
    public WiggleMerger setWiggleMap(LinkedHashMap<String, LinkedList<Pair<Integer, Double>>> wiggleMap){
        // deep clone map, to be sure
        this.wiggleEntries = Collections.unmodifiableMap(Utils.cloneLinkedHashMapWiggle(wiggleMap));
        return this;
    }

    /**
     * Set the track information for the WIGGLE format. If not set, the default value will
     * be used.
     * @param project The projects name, or what so ever
     * @return this
     */
    public WiggleMerger setTrackInformation(String project){
        this.trackInformation = String.format("track type=wiggle_0 name=\"%s\"", project);
        return this;
    }

    /**
     * Set the variableStep chromosome name, for the super contig (after merging)
     * @param chromosomeName The user defined chromosome name
     * @return this
     */
    public WiggleMerger setVariableStep(String chromosomeName){
        this.variableStep = String.format("variableStep name=%s", chromosomeName.trim().replaceAll("\\s+", ""));
        return this;
    }

    /**
     * Retrieve the list with the fasta entries.
     * @return A Map containing the fasta entries or null
     */
    public Map<String, String> getFastaEntries() {
        return fastaEntries;
    }

    /**
     * Retrieve the wiggle entries.
     * @return A map containing the wiggle entries or null
     */
    public Map<String, LinkedList<Pair<Integer, Double>>> getWiggleEntries() {
        return wiggleEntries;
    }

    /**
     * Retrieves the track information
     * @return The user defined track info or the default value
     */
    public String getTrackInformation() {
        return trackInformation;
    }

    /**
     * Retrieves the track information
     * @return The user defined variableStep line with chromsome name or the default value
     */
    public String getVariableStep() {
        return variableStep;
    }

    /**
     * Retrieves the map of the merged fasta file
     * @return The super fasta file
     */
    public Map<String, String> getSuperFASTA(){
        return superFASTA;
    }

    /**
     * Returns the super wiggle in double[]-array format
     * @return An double[] array with the genomic position and coverage
     */
    public double[] getSuperWiggle(){
        return this.superWiggle;
    }

    /**
     * The main wiggle merge call. Merges a wiggle file containing multiple wiggle entries
     * in the order corresponding to the one in the based multi-FASTA-file.
     * The result will be stored in the superWiggle array.
     * @param absoluteValues True=make absolute values, false do not
     * @return this
     * @throws WiggleMergerException Throws an exception if merging fails
     */
    public WiggleMerger mergeWiggleFile(boolean absoluteValues) throws WiggleMergerException{

        if(this.wiggleEntries == null || this.wiggleEntries.size() == 0){
            throw new WiggleMergerException("Wiggle Map not set or empty");
        }
        if(this.fastaEntries == null || this.fastaEntries.size() == 0){
            throw new WiggleMergerException("FASTA Map not set or empty");
        }

        int lengthSuperContig;

        fastaMergerInstance = FASTAMerger.getInstance();

        fastaMergerInstance.mergeFASTAsNew(new LinkedHashMap<>(this.fastaEntries));

        this.superFASTA = new HashMap<>();
        this.superFASTA.put("SuperFASTA", fastaMergerInstance.getConcatenatedSequence());

        lengthSuperContig = fastaMergerInstance.getConcatenatedSequence().length();

        this.superWiggle = new double[lengthSuperContig+1]; // +1 => index now equal position number

        // Shift will be adjusted so every contig position will be shifted to its correct
        // super contig position
        int positionShift = 0;

        for(String fastaEntry : this.fastaEntries.keySet()){
        	//System.out.println("fastaEntry: " + fastaEntry);
            LinkedList<Pair<Integer, Double>> wiggleEntry = this.wiggleEntries.get(fastaEntry);
            //System.out.println("wiggleEntry: " + this.wiggleEntries.keySet());
            if(wiggleEntry == null){
                throw new WiggleMergerException(String.format("Gene was not found in wiggle headers."));
            }

            for(Pair<Integer, Double> positionCoverage : wiggleEntry){
                // Set the expression strength (read coverage) value to the
                // correct super wiggle position
                if(absoluteValues){
                    this.superWiggle[positionCoverage.getKey() + positionShift] = Math.abs(positionCoverage.getValue());
                } else{
                    this.superWiggle[positionCoverage.getKey() + positionShift] = positionCoverage.getValue();
                }

            }
            /*
            Shift the position by the current contig length, so the next
            contig positions will be assigned to the correct merged
            super contig position.
             */
            positionShift += this.fastaEntries.get(fastaEntry).length();
        }
        return this;
    }
}
