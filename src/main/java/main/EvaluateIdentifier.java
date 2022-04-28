
package main;

import utils.ioNew.EGeneIdentifier;
import utils.ioNew.Utils;

import javax.sql.rowset.serial.SerialRef;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * tss-predator
 * Description:
 *
 * @author fillinger
 * @version ${VERSION}
 *          Date: 3/1/16
 *          EMail: sven.fillinger@student.uni-tuebingen.de
 */
public class EvaluateIdentifier {

    /**
     * For proper integrity of the mapping and cross-linking between
     * FASTA, wiggle and (optional) GFF-files, we have to validate,
     * that there is one common identifier in all files, otherwise
     * the cross-linking for the multiple contig handling is not possible.
     * @param fastaFile the FASTA file
     * @param wiggleFile the wiggle file
     * @param gffFile (optional) the gff file
     * @return the common identifier or null
     */
    /*public static EGeneIdentifier evaluateCommonIdentifier(String fastaFile, String wiggleFile, String... gffFile) throws IOException{

        if(findIdentifier(fastaFile).contains("gi")){
            if(findIdentifier(wiggleFile).contains("gi")){
                if(gffFile.length != 0 && !gffFile[0].isEmpty()){
                    String giWiggleFile = Utils.getSeqID(findIdentifier(wiggleFile), EGeneIdentifier.GI);
                    System.out.println("giwiggleFile: " + giWiggleFile);
                    if(giWiggleFile.contains("=")) {
                        giWiggleFile = Utils.getSeqID(giWiggleFile.split("=")[1], EGeneIdentifier.GI);
                        System.out.println("giwiggleFile1: " + giWiggleFile);
                        
                        
                    }
                    System.out.println("gffFileFirst: " + gffFile[0]);
                    if(matchToGFFIdentifier(giWiggleFile, gffFile[0])) {
                        // Return the Identifier type, when found in GFF
                        return EGeneIdentifier.GI;
                    }
                } else{
                    // When no GFF file is given or is empty
                    return EGeneIdentifier.GI;
                }
            }
        }

        if(findIdentifier(fastaFile).contains("gb")){
            if(findIdentifier(wiggleFile).contains("gb")){
                if(gffFile.length != 0 && !gffFile[0].isEmpty()){
                    String giWiggleFile = Utils.getSeqID(findIdentifier(wiggleFile), EGeneIdentifier.GB);
                    System.out.println("giwiggleFile: " + giWiggleFile);
                    if(giWiggleFile.contains("=")) {
                        giWiggleFile = Utils.getSeqID(giWiggleFile.split("=")[1], EGeneIdentifier.GB);
                    }
                    if(matchToGFFIdentifier(giWiggleFile, gffFile[0])) {
                        // Return the Identifier type, when found in GFF
                        return EGeneIdentifier.GB;
                    }
                } else {
                    // When no GFF file is given or is empty
                    return EGeneIdentifier.GB;
                }
            }
        }
        if(findIdentifier(fastaFile).contains("ref")){
            if(findIdentifier(wiggleFile).contains("ref")){
                if(gffFile.length != 0 && !gffFile[0].isEmpty()){
                    String giWiggleFile = Utils.getSeqID(findIdentifier(wiggleFile), EGeneIdentifier.REF);
                    System.out.println("giwiggleFile: " + giWiggleFile);
                    if(giWiggleFile.contains("=")) {
                        giWiggleFile = Utils.getSeqID(giWiggleFile.split("=")[1], EGeneIdentifier.REF);
                        System.out.println("giwiggleFile1: " + giWiggleFile);
                    }
                    if(matchToGFFIdentifier(giWiggleFile, gffFile[0])) {
                        // Return the Identifier type, when found in GFF
                        return EGeneIdentifier.REF;
                      
                    }
                } else {
                    // When no GFF file is given or is empty
                    return EGeneIdentifier.REF;
                }
            }
        }
        return null;
    }*/
	
	public static String evaluateCommonIdentifierNew(String fastaFile, String wiggleFile, PrintStream out, String... gffFile) throws IOException{

		if(findIdentifierNew(fastaFile, ">").contains(">")) {
			String fastaIdLine = findIdentifierNew(fastaFile, ">");
			String fastaId = fastaIdLine.split(" ")[0];
			//System.out.println("fastaId: " + fastaId);
			if(findIdentifierNew(wiggleFile, "chrom=").contains("chrom=")){
				if(gffFile.length != 0 && !gffFile[0].isEmpty()){
					String giWiggleFile = findIdentifierNew(wiggleFile, "chrom=");
					//System.out.println("giwiggleFile: " + giWiggleFile);
					if(giWiggleFile.contains("chrom=")) {
						//System.out.println("split: " + giWiggleFile.split("chrom="));
						String information = giWiggleFile.split("chrom=")[1];
						//System.out.println("split: " + information);
						giWiggleFile = Utils.getSeqIDNew(information, fastaId.substring(1, fastaId.length()));
						//System.out.println("giwiggleFile1: " + giWiggleFile);      
					}
					//System.out.println("gffFileFirst: " + gffFile[0]);
					//System.out.println("la: " + gffFile[0]);
					if(matchToGFFIdentifier(giWiggleFile, gffFile[0])) {
						// Return the Identifier type, when found in GFF
						//System.out.println("iden: " + giWiggleFile);
						return giWiggleFile;
					}else {
						out.println("Please check for annotation file! Identifier does not match with fasta and wiggle files!");
					}
				} else{
					// When no GFF file is given or is empty
					return fastaId.substring(1);
				}
			}
		}
		return null;
	}


    /*private static String findIdentifier(String file) throws IOException{

        Path filePath = Paths.get(file);

        if(file.isEmpty()){
            return "";
        }
        if(filePath.toFile().isDirectory()){
            return "dir";
        }

        String line = "";

        BufferedReader bufferedReader = Files.newBufferedReader(filePath);
        while((line = bufferedReader.readLine()) != null){
        	System.out.println("line: " + line);
            if(line.contains("gi") || line.contains("gb") || line.contains("ref")){
                break;
            }
        }
        return (line==null)?"":line;
    }*/
    
    private static String findIdentifierNew(String file, String l) throws IOException{

        Path filePath = Paths.get(file);

        if(file.isEmpty()){
            return "";
        }
        if(filePath.toFile().isDirectory()){
            return "dir";
        }

        String line = "";

        BufferedReader bufferedReader = Files.newBufferedReader(filePath);
        while((line = bufferedReader.readLine()) != null){
        	//System.out.println("line: " + line);
            if(line.contains(l)){
            	//System.out.println("l: " + line);
                break;
            }
        }
        return (line==null)?"":line;
    }


    /**
     * Checks a GFF file for the presence of a certain Identifier
     * @param identifier The identifier to search for
     * @param gffFile The GFF file path
     * @return true/false
     * @throws IOException Could not find the GFF file
     */
    private static boolean matchToGFFIdentifier(String identifier, String gffFile) throws IOException{
        Path filePath = Paths.get(gffFile);
        //System.out.println("filePath: " + filePath);

        if(gffFile.isEmpty()){
            return false;
        }
        if(filePath.toFile().isDirectory()){
            return false;
        }
        boolean idInHeader = false;
        String line = "";
        //System.out.println("Identifier1: " + identifier);
        //System.out.println("gff File: " + gffFile);
        BufferedReader bufferedReader = Files.newBufferedReader(filePath);
        while((line = bufferedReader.readLine()) != null){
        	if (line.startsWith("#") && !idInHeader){
        		//System.out.println("line: " + line);
        		idInHeader = line.contains(identifier) ;
        	}
        	//System.out.println("contain identifier?:" + idInHeader);
        	//System.out.println("line with identifier: " + line);
        	String firstColumn = line.split("\\s+")[0];
        	//System.out.println("First column to check for identifier: " + firstColumn);
        	if(identifier.contains(firstColumn)){
        		//System.out.println("Identifier found in GFF: " + firstColumn);
        		return (idInHeader && true);
        	}
        }
        return false;
    }	
}