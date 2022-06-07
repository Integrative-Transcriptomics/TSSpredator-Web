
package contighandlerNew;

import fasta.ioNew.FASTAMerger;
import fasta.ioNew.FASTAParser;
import fasta.ioNew.FASTAParserException;

import utils.ioNew.Pair;
import wiggle.ioNew.WiggleMerger;
import wiggle.ioNew.WiggleMergerException;
import wiggle.ioNew.WiggleParser;
import wiggle.ioNew.WiggleParserExeption;

import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;

// import contighandlerNew.MultiContigHandler;

/**
 * master-thesis-sfillinger
 * Description:
 *
 * @author fillinger
 * @version ${VERSION}
 *          Date: 1/18/16
 *          EMail: sven.fillinger@student.uni-tuebingen.de
 */
public class MultiContigHandler {


    /**
     * Stores the instance of the fastaMerger
     */
    private FASTAMerger fastaMerger = FASTAMerger.getInstance();

    /**
     * Stores an instance of the wiggleMerger
     */
    private WiggleMerger wiggleMerger = new WiggleMerger();

    /**
     * The WiggleMap
     */
    private LinkedHashMap<String, LinkedList<Pair<Integer, Double>>> wiggleMap;

    /**
     * Stores the offset of every contig in the super-contig
     */
    private LinkedHashMap<String, Integer> contigOffsetMap;

    /**
     * Nullary constructor
     */
    public MultiContigHandler(){}

    /**
     * Parse and Merge the fasta-file
     * @param multiFASTAfile The FASTA file containing one ore more FASTA entries
     * @param identifier The type of identifier used
     * @return this
     * @throws FASTAParserException If the FASTA parsing fails
     */
    /*public MultiContigHandler parseAndMergeFASTA(String multiFASTAfile, EGeneIdentifier identifier) throws FASTAParserException{
        boolean useGIFromHeader = true;
        fastaMerger.mergeFASTAs(FASTAParser.parseDNA(multiFASTAfile, identifier, useGIFromHeader));
        System.err.println("Hi");

        return this;
    }*/
    
    public MultiContigHandler parseAndMergeFASTANew(String multiFASTAfile, String identifier) throws FASTAParserException{
        boolean useGIFromHeader = true;
        fastaMerger.mergeFASTAsNew(FASTAParser.parseDNANew(multiFASTAfile, identifier, useGIFromHeader));
        //System.err.println("Hi");

        return this;
    }

    /**
     * Set and parse the wiggle file
     * @param wiggleFile The wiggle file
     * @param identifier The type of identifier used
     * @return this
     * @throws WiggleParserExeption thrown when parsing fails
     */
    /*public MultiContigHandler setAndParseWiggleFile(String wiggleFile, EGeneIdentifier identifier) throws WiggleParserExeption{

        wiggleMap = WiggleParser.parseWiggleFile(wiggleFile, identifier);

        return this;
    }*/
    
    public MultiContigHandler setAndParseWiggleFileNew(String wiggleFile, String identifier) throws WiggleParserExeption{

        wiggleMap = WiggleParser.parseWiggleFileNew(wiggleFile, identifier);

        return this;
    }

    /**
     * Make the super contig when you have set the multi-fasta file
     * and the wiggle file.
     * @param absoluteValues Make coverage values absolute or not
     * @return this
     * @throws WiggleMergerException thrown when merging fails
     */
    public MultiContigHandler makeSuperContig(boolean absoluteValues) throws WiggleMergerException{

        if(fastaMerger.getFASTAEntries() != null && wiggleMap != null){
            wiggleMerger.setFASTAmap(fastaMerger.getFASTAEntries()).setWiggleMap(wiggleMap);
            wiggleMerger.mergeWiggleFile(absoluteValues);
        } else {
            throw new WiggleMergerException("You have to set the FASTAEntries and WiggleFile first");
        }

        return this;
    }


    /**
     * Get the SuperContig sequence (concatenated multi-contig sequence)
     * @return The concatenated sequence
     */
    public String getSuperContig(){
        if(fastaMerger.getSuperContigMapper().isEmpty()){
            fastaMerger.buildMappingToSuperContig();
        }
        return fastaMerger.getConcatenatedSequence();
    }

    /**
     * Retrieve the super wiggle
     * @return The merged wiggle file, as double[] array with index
     * as genomic position and value as read coverage
     */
    public double[] getSuperWiggle(){
        return wiggleMerger.getSuperWiggle();
    }


    /**
     * Get the SuperContig Map, which enables mapping from the position in
     * the SuperContig back to the original contig position. The SuperContig position
     * is given by the even index divided by 2.
     *
     *       supercontig = (even index) / 2     (1)
     *
     * The odd index i+1 after every even index i is the corresponding index of the
     * mapping fasta entry, whose order is preserved and can be determined from the
     * FASTA LinkedHashMap.
     * @return A list of integers with the original position and the original contig index
     */
    public List<Integer> getSuperContigMap(){
        if(fastaMerger.getSuperContigMapper().isEmpty()){
            fastaMerger.buildMappingToSuperContig();
        }
        return fastaMerger.getSuperContigMapper();
    }

    /**
     * Retrieve the multiple FASTA entries with id:sequence from the original
     * multiFASTA file. You have to call the parseAndMergeFASTA() function before
     * that.
     * @return The map with the string id and sequence from the multi FASTA file
     */
    public LinkedHashMap<String, String> getFASTAentries(){
        return fastaMerger.getFASTAEntries();
    }


    /**
     * Delete WiggleMerger object. Can be called if developer wants to free the memory
     * and the wiggle merger is not necessary any more.
     */
    public void clearWiggleMerger(){
        this.wiggleMerger = new WiggleMerger();
    }

    /**
     * Returns the WiggleEntries
     * @return the wiggle entries
     */
    public LinkedHashMap<String, LinkedList<Pair<Integer,Double>>> getWiggleMap(){return this.wiggleMap;}


    /**
     * Computes the offset (as integer) of every contig in the final super-contig
     * and stores it in an hash-map.
     * @return A list of contig IDs (String) and their offset (Integer)
     * @throws Exception if FASTA file empty
     */
    public LinkedHashMap<String, Integer> calcContigOffset() throws Exception{

        if(this.contigOffsetMap != null){
            return this.contigOffsetMap;
        }

        this.contigOffsetMap = new LinkedHashMap<>();

        if(fastaMerger != null && fastaMerger.getFASTAEntries().size() != 0){
            int offset = 0;
            for(String contigID : fastaMerger.getFASTAEntries().keySet()){
            	//System.out.println("contigID " + contigID);
            	//String shortenedContigID = contigID.split("\\|")[3];
                int size = this.fastaMerger.getFASTAEntries().get(contigID).length();
                //System.out.println("offset: " + size);
                //System.out.println("shortenedID: " + shortenedContigID);
                if(contigID.contains("|")) {
                	String shortenedContigID = contigID.split("\\|")[3];
                	//System.out.println("shortenedID: " + shortenedContigID);
                	this.contigOffsetMap.put(shortenedContigID, offset);
                }else {
                	this.contigOffsetMap.put(contigID, offset);
             }
                offset += size;
            }
        } else {
            throw new Exception("FASTA files not set or empty :(");
        }

        return this.contigOffsetMap;
    }

}
